import React from 'react';

const MenuSection = ({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  filteredMenuItems,
  menuCategories,
  addToCart,
  setCurrentItem,
}) => (
  <div className="w-full md:w-1/2 bg-gray-50 p-4 overflow-hidden flex flex-col">
    <div className="mb-4">
      <div className="relative">
        <input
          className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search menu items..."
          type="text"
        />
        <svg
          className="h-5 w-5 absolute left-3 top-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery('')}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
    {!searchQuery && (
      <div className="mb-4 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
                activeCategory === category.name
                  ? `${category.color} text-white`
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    )}
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filteredMenuItems &&
          filteredMenuItems.map((item) => (
            <button
              key={item.id}
              className="bg-white rounded-xl p-3 text-center shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-500 flex flex-col justify-between"
              onClick={() => {
                setCurrentItem(item);
                addToCart(item);
              }}
            >
              <div className="mb-2">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">
                  {item.name}
                </h3>
              </div>
              <div className="text-blue-600 font-medium">${item.price.toFixed(2)}</div>
            </button>
          ))}
      </div>
    </div>
  </div>
);

export default MenuSection;