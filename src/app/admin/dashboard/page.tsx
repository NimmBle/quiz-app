import { getQuizzes } from "./actions";
import DashboardClient from "./DashboardClient";

export const metadata = {
    title: "Админ Панел | Аз мога — тук и сега",
};

export default async function DashboardPage() {
    const quizzes = await getQuizzes();
    return <DashboardClient quizzes={quizzes} />;
}
