import { NextApiRequest, NextApiResponse } from 'next';

export default (request: NextApiRequest, response: NextApiResponse) => {
    const users = [
        { id: 1, name: 'Clarinha' },
        { id: 2, name: 'Estrelinha' },
        { id: 3, name: 'Pitoco' }
    ];

    return response.json(users);
}