import mongoose from 'mongoose'
import colors from 'colors'

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.DATABASE_URL)
        const url = `${connection.connection.host}:${connection.connection.port}`
        console.log(colors.magenta(`MongoDB Connected in ${url}`))
    } catch (error) {
        console.log(colors.bgRed.black.bold('Error connecting MongoDB'))
        process.exit(1)
    }
}
