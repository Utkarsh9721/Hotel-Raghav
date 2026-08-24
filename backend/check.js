import bcrypt from "bcrypt";

const hash = "$2a$10$PVMqXDw.8JXBVVMRWPs49.PpCzenpcf8kmsRrsqxZwIZywY6LzwOe";
const password = "abhijeet1991";

async function checkPassword() {
    const result = await bcrypt.compare(password, hash);
    console.log(result);
}

checkPassword();