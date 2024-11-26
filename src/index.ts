import express from 'express'
import { expressMiddleware } from '@apollo/server/express4';
import createApolloGraphqlServer from './graphql';
import UserService from './services/user';

async function init() {
    const app = express()
    const PORT = Number(process.env.port) || 8000

    app.use(express.json())

    const gqlServer = await createApolloGraphqlServer()

    app.get('/', (req, res) => {
        res.json({
            message: "Server is up and running"
        })
    })

    app.use('/graphql', expressMiddleware(gqlServer, {
        context: async ({req}) => {
            const token = req.headers['Authorization']
            try {
                const user = UserService.decodeJWTToken(token as string)
                return {user}
            } catch(err) {
                return {}
            }
        }
    }))

    app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`))
}

init()
