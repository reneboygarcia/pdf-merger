import PDFMerger from './components/PDFMerger'
import { Toaster } from "./components/ui/toaster"

function App() {
  try {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <PDFMerger />
        <Toaster />
      </div>
    )
  } catch (error) {
    console.error('Error in App component:', error)
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-red-500">
          An error occurred while loading the application.
        </div>
      </div>
    )
  }
}

export default App
