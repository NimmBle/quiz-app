import { getQuizzes, getDashboardStats } from "./actions";
import DashboardClient from "./DashboardClient";

export const metadata = {
    title: "Админ Панел | Аз мога — тук и сега",
};

export default async function DashboardPage() {
    const quizzes = await getQuizzes();
    const stats = await getDashboardStats();
    return <DashboardClient quizzes={quizzes} stats={stats} />;
}
