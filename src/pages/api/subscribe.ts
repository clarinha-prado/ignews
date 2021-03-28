import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";
import { query as q } from 'faunadb'

type User = {
    ref: {
        id: string;
    },
    data: {
        stripe_customer_id: string;
    }
}

// criação da checkout session do Stripe
export default async (req: NextApiRequest, resp: NextApiResponse) => {
    // por ser criação só vai aceitar  POST
    if (req.method === 'POST') {

        // obter sessão do next-auth para saber qual usuário está logado
        const session = await getSession({ req });

        // obter dados do usuário no fauna db
        const user = await fauna.query<User>(
            q.Get(q.Match(q.Index('user_by_email'), q.Casefold(session.user.email)))
        );

        // verificar se a query retornou o dado stripe_customer_id
        let customerId = user.data.stripe_customer_id;
        if (!customerId) {
            // cria o usuário no stripe - o Stripe retorna o id único
            const stripeCustomer = await stripe.customers.create({
                email: session.user.email,
                // metadata
            });

            // gravar o id stripe do usuário no fauna db
            await fauna.query(
                q.Update(q.Ref(q.Collection('users'), user.ref.id), {
                    data: {
                        stripe_customer_id: stripeCustomer.id,
                    }
                }
                ));

            customerId = stripeCustomer.id;
        }

        // cria uma sessão de checkout
        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],           // poderiam ser outros, por isso o colchetes
            billing_address_collection: 'required',
            line_items: [
                { price: 'price_1IYIuwH8tMrViFX4SelEdeP1', quantity: 1 }
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: process.env.STRIPE_SUCCESS_URL,
            cancel_url: process.env.STRIPE_CANCEL_URL
        });

        // retorna sucesso
        return resp.status(200).json({ sessionId: stripeCheckoutSession });

    } else {
        // responde para o solicitante q esta rota só aceita POST
        resp.setHeader('Allow', 'POST');
        resp.status(405).end('Method not allowed');
    }
}