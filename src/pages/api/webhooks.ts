// rota chamada pelo webhook do stripe para informar sobre os eventos ocorridos

/* em desenvolvimento é preciso executar o CLI stripe.exe, usando o CMD do Windows (com o bash
    não funciona)

    o CLI vai receber as chamadas do webhook e encaminhar para a rota local
    comando: 
      1. stripe login (vai abrir o browser)
      2. stripe listen --forward-to localhost:3000/api/webhooks

      cartão para teste de sucesso 4242 4242 4242
*/
import { Readable } from 'stream'
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';
import { stripe } from '../../services/stripe';
import { saveSubscription } from './_lib/manageSubscription';

async function buffer(readable: Readable) {
    const chunks = [];

    for await (const chunk of readable) {
        chunks.push(
            typeof chunk === 'string' ? Buffer.from(chunk) : chunk
        );
    }

    return Buffer.concat(chunks);
}


// desabilita o 'entendimento padrão' do next sobre os corpo da requisição q estão sendo retornados
// o next espera o corpo de um formulário ou json, ou algo assim - para q o next receba como strem
// precisa da configuração abaixo
export const config = {
    api: {
        bodyParser: false
    }
}

const relevantEvents = new Set([
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
    // 'customer.subscription.created'
])

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {

        const buf = await buffer(req);

        const secret = req.headers['stripe-signature']

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
        } catch (err) {
            console.log(err.message);
            return res.status(400).send(`Webhook error: ${err.message}`);
        }

        const { type } = event;
        console.log('Evento recebido: ' + type);

        if (relevantEvents.has(type)) {

            try {
                switch (type) {
                    case 'customer.subscription.updated':
                    case 'customer.subscription.deleted':

                        const subscription = event.data.object as Stripe.Subscription;

                        await saveSubscription(
                            subscription.id,
                            subscription.customer.toString(),
                            false
                        )

                        break;

                    case 'customer.subscription.created':

                        const checkoutSession = event.data.object as Stripe.Checkout.Session;

                        await saveSubscription(
                            checkoutSession.subscription.toString(),
                            checkoutSession.customer.toString(),
                            true
                        )

                        break;
                    default:
                        throw new Error('Unhandled event: ' + type);
                }
            } catch (err) {
                return res.json({ error: 'Webhook handler failed.' });
            }

        }

        res.status(200).json({ received: true });  // res.status(200).json = res.json

    } else {
        // responde para o solicitante q esta rota só aceita POST
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method not allowed');
    }
}