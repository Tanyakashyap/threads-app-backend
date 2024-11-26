import { emitWarning } from "node:process"
import { prismaClient } from "../lib/db"
import {createHmac, randomBytes} from "node:crypto"
import JWT from "jsonwebtoken"

const JWT_SECRET= "$uperM@a@123"

export interface CreateUserPayload {
    firstName: string,
    lastName?: string,
    email: string,
    password: string
}

export interface getUserTokenPayload {
    email: string,
    password: string
}

class UserService {
    public static createUser(payload: CreateUserPayload) {
        const {firstName, lastName, email, password} = payload
        const salt = randomBytes(32).toString('hex')
        const hashedPassword = this.generateHash(salt, password)

        return prismaClient.user.create({
            data: {
                firstName,
                lastName,
                email,
                salt,
                password: hashedPassword
            }
        })
    }

    private static getUserByEmail(email: string) {
        return prismaClient.user.findUnique({where: {email}})
    } 

    public static getUserById(id: string) {
        return prismaClient.user.findUnique({where: {id}})
    } 


    private static generateHash(salt: string, password: string) {
        const hashedPassword = createHmac('sha256', salt).update(password).digest('hex')
        return hashedPassword
    }

    public static async getUserToken(payload: getUserTokenPayload) {
        const {email, password} = payload
        const user = await this.getUserByEmail(email)
        if(!user) throw new Error("User not found!")
        
        const userSalt = user.salt
        const hashedPassword = this.generateHash(userSalt, password)

        if(hashedPassword != user.password) {
            throw new Error("Incorrect Password!")
        }

        const token = JWT.sign({ id: user.id, email: user.email}, JWT_SECRET)
        return token
    }

    public static decodeJWTToken(token: string) {
        return JWT.verify(token, JWT_SECRET)
    }
}

export default UserService