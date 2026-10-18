import bcrypt from "bcrypt";
const saltRounds = 10;


async function hashPassword(password: string) {
    const h = bcrypt.hash(password, saltRounds)
    return h
}

async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
}

export { hashPassword, verifyPassword }