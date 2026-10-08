import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/ui'
import { useSession } from './lib/auth'
import LoginPage from './pages/Login'
import BookPage from './pages/Book'
import ChapterPage from './pages/ChapterPage'
import CurriculumPage from './pages/Curriculum'
import ExamIntroPage from './pages/ExamIntro'
import ExamListPage from './pages/ExamList'
import HomePage from './pages/Home'
import LessonPage from './pages/LessonPage'
import ProgressPage from './pages/Progress'
import RemedialListPage from './pages/RemedialList'
import RemedialPage from './pages/RemedialPage'
import ReportPage from './pages/Report'
import RunPage from './pages/Run'

export default function App() {
  const session = useSession()
  if (!session) return <LoginPage />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/curriculum" element={<CurriculumPage />} />
        <Route path="/curriculum/:chapterId" element={<ChapterPage />} />
        <Route path="/lesson/:pointId" element={<LessonPage />} />
        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exam/:chapterId" element={<ExamIntroPage />} />
        <Route path="/run/:roundId" element={<RunPage />} />
        <Route path="/report/:roundId" element={<ReportPage />} />
        <Route path="/remedial" element={<RemedialListPage />} />
        <Route path="/remedial/:roundId" element={<RemedialPage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </Layout>
  )
}
