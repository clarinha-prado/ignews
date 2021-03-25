import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { stripe } from "../../services/stripe";

// criação da checkout session do Stripe
export default async (req: NextApiRequest, resp: NextApiResponse) => {
    // por ser criação só vai aceitar  POST
    if (req.method === 'POST') {
        // obter sessão do next-auth para saber qual cliente está logado
        const session = await getSession({ req });

        // cria o cliente no stripe - o Stripe retorna 
        const stripeCustomer = await stripe.customers.create({
            email: session.user.email,
            // metadata
        });

        // cria uma sessão de checkout
        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomer.id,
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