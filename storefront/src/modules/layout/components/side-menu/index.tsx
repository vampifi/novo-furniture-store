"use client"

import { Popover, Transition } from "@headlessui/react"
import { ChevronRight, XMark } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { Fragment } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HiOutlineMenu } from "react-icons/hi"

interface ProductCategory {
  id: string
  name: string
  description: string | null
  handle: string
  rank: number | null
  parent_category_id: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown> | null
  parent_category: any
  category_children: any[]
}

interface SideMenuProps {
  product_categories: ProductCategory[] | null
}

const SideMenu = ({ product_categories }: SideMenuProps) => {
  const topLevelCategories = product_categories?.filter(cat => !cat.parent_category_id) || []

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none px-4 text-ui-fg-subtle hover:text-ui-fg-base group"
                >
                
                  <HiOutlineMenu className="h-6 w-6" /> 
                  
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full"></div>
                </Popover.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-full"
              >
                <Popover.Panel className="flex flex-col fixed top-0 left-0 w-full max-w-xs h-full z-50 bg-gradient-to-b from-ui-bg-base to-ui-bg-subtle shadow-2xl border-r border-ui-border-base" static>
                  <div className="flex flex-col h-full">
                  
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-ui-bg-base to-ui-bg-subtle border-b border-ui-border-base shadow-sm">
                      <span className="text-xl font-bold text-ui-fg-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Product Categories
                      </span>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        className="p-2 hover:bg-ui-bg-base-hover rounded-full transition-all duration-200 hover:rotate-90 hover:shadow-md"
                        aria-label="Close menu"
                      >
                        <XMark className="w-5 h-5" />
                      </button>
                    </div>

                   
                    <div className="flex-1 overflow-y-auto p-5">
                      {topLevelCategories.length > 0 ? (
                        <ul className="space-y-3">
                          {topLevelCategories.map((category, index) => (
                            <li key={category.id} className="group">
                              <LocalizedClientLink
                                href={`/store?category=${category.handle}`}
                                className="flex items-center justify-between py-4 px-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-ui-bg-base hover:border hover:border-ui-border-base transform hover:-translate-y-0.5"
                                onClick={close}
                                data-testid={`category-${category.handle}-link`}
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mr-3 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300">
                                    <span className="text-sm font-bold text-blue-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <span className="text-ui-fg-base font-medium group-hover:text-ui-fg-subtle transition-colors duration-300">
                                    {category.name}
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-ui-fg-muted group-hover:text-ui-fg-base group-hover:translate-x-1 transition-all duration-300" />
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-ui-fg-muted">
                          <div className="w-16 h-16 rounded-full bg-ui-bg-subtle flex items-center justify-center mb-4">
                            <XMark className="w-8 h-8" />
                          </div>
                          <p className="text-center">No categories available</p>
                        </div>
                      )}
                    </div>

                    
                    <div className="p-4 border-t border-ui-border-base bg-ui-bg-subtle">
                      <p className="text-xs text-ui-fg-muted text-center">
                        Browse our product collection
                      </p>
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu