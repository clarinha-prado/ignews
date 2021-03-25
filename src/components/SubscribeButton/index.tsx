import { signIn, useSession } from 'next-auth/client';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';
import { api } from '../../services/api';

interface subscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({ priceId }: subscribeButtonProps) {
    const [session] = useSession();

    async function handleSubscribe() {
        if (!session) {
            signIn('github');
            return;
        }

        // fazer requisição para rota interna de criação da checkout session
        try {
            // post usando axios
            const response = await api.post('/subscribe');
            console.log('devia ter feito o post');
            const { sessionId } = response.data;
            const stripe = await getStripeJs();
            await stripe.redirectToCheckout(sessionId);
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <button
            type="button"
            className={styles.subscribeButton}
            onClick={() => handleSubscribe}
        >
            Subscribe now
        </button>
    );
}