import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

import { query as q } from 'faunadb'
import { fauna } from '../../../services/fauna'

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        Providers.GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: 'read:user'
        }),
    ],

    callbacks: {
        // sign in só é feito com sucesso se essa função retornar true
        async signIn(user, account, profile) {
            const { email } = user;

            try {

                // se não existir usuário com este email
                // if(condição, ação true, ação false)
                await fauna.query(
                    q.If(
                        // condição
                        q.Not(q.Exists(q.Match(q.Index('user_by_email'), q.Casefold(user.email)))),

                        // ação true
                        q.Create(q.Collection('users'), { data: { email } }),

                        // ação false
                        q.Get(q.Match(q.Index('user_by_email'), q.Casefold(user.email))))
                );
                return true;
            } catch {
                return false;
            }
        }
    }
})