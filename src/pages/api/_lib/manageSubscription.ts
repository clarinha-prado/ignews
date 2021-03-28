import { query as q } from 'faunadb';
import { fauna } from "../../../services/fauna";
import { stripe } from '../../../services/stripe';

export async function saveSubscription(
    subscriptionId: string,
    customerId: string,
    createAction = false
) {
    // buscar o usuário no fauna db com o id do stripe
    const userRef = await fauna.query(
        // q.Get traz todos os campos, q.Select traz só os campos escolhidos 
        q.Select('ref', q.Get(q.Match(q.Index('user_by_stripe_customer_id'), customerId)))
    )

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // salvar dados da subscription no fauna db
    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id
    }

    if (createAction) {
        await fauna.query(
            q.Create(q.Collection('subscriptions'), { data: subscriptionData })
        )
    } else {
        await fauna.query(
            // replace substitui o registro todo, todos os campos
            q.Replace(
                q.Select("ref", q.Get(q.Match(q.Index('subscription_by_id'), subscriptionId))),
                { data: subscriptionData }
            ))
    }
}