import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/ui'
import { useAuthState } from './lib/auth'
import LoginPage from './pages/Login'
import BookPage from './pages/Book'
import CalcListPage from './pages/CalcList'
import CalcRecordPage from './pages/CalcRecord'
import CalcRunPage from './pages/CalcRun'
import CalcWeakPage from './pages/CalcWeak'
import SlideRenderPage from './pages/SlideRender'
import ChapterPage from './pages/ChapterPage'
import CurriculumPage from './pages/Curriculum'
import ExamIntroPage from './pages/ExamIntro'
import ExamListPage from './pages/ExamList'
import HomePage from './pages/Home'
import LessonPage from './pages/LessonPage'
import ProgressPage from './pages/Progress'
import RemedialListPage from './pages/RemedialList'
import RemedialPage from './pages/RemedialPage'
import ExplainDemo from './pages/ExplainDemo'
import ReportPage from './pages/Report'
import RunPage from './pages/Run'

export default function App() {
  const { session, ready } = useAuthState()
  // 独立全屏路由（视频截图 / 错题讲解样例）跳过登录
  const isStandalone = window.location.hash.includes('/render/') || window.location.hash.includes('/explain-demo')
  if (!ready && !isStandalone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">加载中…</div>
    )
  }
  if (!session && !isStandalone) return <LoginPage />
  if (isStandalone) return <StandaloneRoutes />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/curriculum" element={<CurriculumPage />} />
        <Route path="/curriculum/:chapterId" element={<ChapterPage />} />
        <Route path="/lesson/:pointId" element={<LessonPage />} />
        <Route path="/calc" element={<CalcListPage />} />
        <Route path="/calc/weak/:skill" element={<CalcWeakPage />} />
        <Route path="/calc/:trainingId" element={<CalcRunPage />} />
        <Route path="/calc/:trainingId/record" element={<CalcRecordPage />} />
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

// 渲染路由在 Layout 外面（无导航栏/页脚，纯内容画面用于视频截图）
function StandaloneRoutes() {
  return (
    <Routes>
      <Route path="/render/:pointId/:slideIdx" element={<SlideRenderPage />} />
      <Route path="/explain-demo" element={<ExplainDemo />} />
    </Routes>
  )
}
