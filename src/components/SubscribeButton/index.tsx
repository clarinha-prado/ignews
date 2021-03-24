import styles from './styles.module.scss';

interface subscribeButtonProps {
    priceId: string;
}

export function SubscribeButton({ priceId }: subscribeButtonProps) {
    return (
        <button
            type="button"
            className={styles.subscribeButton}
            onClick={() => console.log("oi")}
        >
            Subscribe now
        </button>
    );
}