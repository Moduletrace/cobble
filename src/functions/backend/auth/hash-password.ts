import { AppData } from "@/src/data/app-data";

type Params = {
    password: string;
};

export default async function hashPassword({ password }: Params) {
    return await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: AppData["HashCost"],
    });
}
