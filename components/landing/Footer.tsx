export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-screen-xl px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="text-lg font-semibold text-white">
            AI Mock Interview
          </h3>

          <p className="text-sm">
            Practice interviews. Get AI feedback. Improve with confidence.
          </p>

          <div className="flex gap-6 text-sm">
            <a href="https://github.com/" className="hover:text-white">
              GitHub
            </a>
            <a href="#" className="hover:text-white">
              Contact
            </a>
          </div>

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AI Mock Interview
          </p>
        </div>
      </div>
    </footer>
  )
}
