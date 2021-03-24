import { NextApiRequest, NextApiResponse } from 'next';

export default (request: NextApiRequest, response: NextApiResponse) => {
    console.log(request.query);

    const users = [
        { id: 1, name: 'Clarinha' },
        { id: 2, name: 'Estrelinha' },
        { id: 3, name: 'Pitoco' }
    ];

    return response.json(users.filter((user) => user.id === Number(request.query.id)));
}