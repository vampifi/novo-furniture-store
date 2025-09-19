import LocalizedClientLink from "@modules/common/components/localized-client-link"

const LuxuryShowcase = () => {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-[#FAF6F3]">
      <div className="container mx-auto px-4 sm:px-6">
        <div className=" text-center">
          {/* Heading */}
          <h1 className="text-2xl font-bold text-[#474546] mb-6 leading-tight">
            DUSK | Luxury Bedding, Bed Frames, Mattresses, Sofas & Dining Furniture
          </h1>
          
          {/* Description Text with Inline Links */}
          <p className="text-sm md:text-lg font-light mb-8 leading-relaxed opacity-95">
            Fill your home with{' '}
            <LocalizedClientLink href="/sofas" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              luxurious sofas
            </LocalizedClientLink>
            ,{' '}
            <LocalizedClientLink href="/dining-furniture" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              elegant dining furniture
            </LocalizedClientLink>
            ,{' '}
            <LocalizedClientLink href="/beds" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              sophisticated beds
            </LocalizedClientLink>{' '}
            and{' '}
            <LocalizedClientLink href="/bed-frames" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              bed frames
            </LocalizedClientLink>
            ,{' '}
            <LocalizedClientLink href="/mattresses" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              cosy mattresses
            </LocalizedClientLink>{' '}
            and{' '}
            <LocalizedClientLink href="/bedding" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              bed linen
            </LocalizedClientLink>
            . Plus, discover the perfect finishing touches for your home, from{' '}
            <LocalizedClientLink href="/curtains" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              premium curtains
            </LocalizedClientLink>{' '}
            and{' '}
            <LocalizedClientLink href="/towels" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              fluffy cotton towels
            </LocalizedClientLink>{' '}
            to{' '}
            <LocalizedClientLink href="/cushions" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              soft cushions
            </LocalizedClientLink>{' '}
            and{' '}
            <LocalizedClientLink href="/throws" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              textured throws
            </LocalizedClientLink>
            . Designed with high-quality materials hand-picked by the DUSK team, our{' '}
            <LocalizedClientLink href="/dining-room" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              dining room
            </LocalizedClientLink>
            ,{' '}
            <LocalizedClientLink href="/bedroom" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              bedroom
            </LocalizedClientLink>{' '}
            and{' '}
            <LocalizedClientLink href="/bathroom" className="text-[#474546] border-b border-[#474546] hover:border-b-2 hover:text-gray-700 transition-all duration-200">
              bathroom collections
            </LocalizedClientLink>{' '}
            are the epitome of luxury for less, blending modern and timeless designs.
          </p>
        </div>
      </div>
    </section>
  )
}

export default LuxuryShowcase