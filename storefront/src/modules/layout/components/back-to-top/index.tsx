"use client"

const BackToTop = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-12 h-12 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl z-50 group"
      aria-label="Back to top"
    >
      <span className="transform group-hover:-translate-y-1 transition-transform">↑</span>
    </button>
  )
}

export default BackToTop