import React from "react";
import { Search, Plus, Menu } from "lucide-react";

const MenuItems = ({
  searchQuery,
  handleSearch,
  categories,
  activeCategory,
  handleCategoryClick,
  filteredMenuItems,
  currentItem,
  setCurrentItem,
  addToCart,
  loading,
  error,
}) => {
  return (
    <>
      <div className="mb-3">
        <div className="relative">
          <input
            className="w-full p-2 pl-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for items..."
          />
          <Search className="h-4 w-4 absolute left-2 top-3 text-gray-400" />
          {searchQuery && (
            <button
              className="absolute right-2 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => handleSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mb-3 overflow-x-auto flex space-x-2">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeCategory === category.name
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => handleCategoryClick(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory || "All Items"}
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-2 rounded-lg">{error}</div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Menu className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No items found</p>
            <p className="text-xs text-gray-500 mt-1">Try a different search term or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredMenuItems.map((item) => (
              <div
                key={item.ItemId}
                className={`p-2 rounded-lg border cursor-pointer hover:shadow-md ${
                  currentItem?.ItemId === item.ItemId ? "bg-indigo-50 border-indigo-400" : "bg-white"
                }`}
                onClick={() => setCurrentItem(item)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-800 text-sm">{item.ItemName}</h4>
                  <button
                    className="bg-green-100 text-green-700 p-1 rounded-full hover:bg-green-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">#{item.ItemCode}</span>
                  <span className="font-semibold text-indigo-700 text-sm">AED {item.Rate.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MenuItems;