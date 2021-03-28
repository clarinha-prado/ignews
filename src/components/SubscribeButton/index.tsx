import { signIn, useSession } from 'next-auth/client';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';
import { api } from '../../services/api';
import { useRouter } from 'next/router';

interface subscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({ priceId }: subscribeButtonProps) {
    const [session] = useSession();
    const router = useRouter();

    async function handleSubscribe() {
        if (!session) {
            signIn('github');
            return;
        }

        if (session.activeSubscription) {
            router.push('/posts');
            return;
        }


        // fazer requisição para rota interna de criação da checkout session
        try {
            // post usando axios
            const response = await api.post('/subscribe');

            const { sessionId } = response.data;
            const stripe = await getStripeJs();
            await stripe.redirectToCheckout({ sessionId: sessionId.id });
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <button
            type="button"
            className={styles.subscribeButton}
            onClick={() => handleSubscribe()}
        >
            Subscribe now
        </button>
    );
}