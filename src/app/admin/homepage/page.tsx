'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CategoryBox {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  filterType: string;
  venueCount: number;
  gradient: string;
}

const defaultCategories: CategoryBox[] = [
  {
    id: '1',
    title: 'Beachfront Venues',
    subtitle: 'Ocean views & coastal charm',
    description: 'Say "I do" with your toes in the sand and the sound of waves as your soundtrack.',
    imageUrl: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop&q=80',
    filterType: 'beach',
    venueCount: 15,
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: '2',
    title: 'Garden Venues',
    subtitle: 'Natural beauty & romance',
    description: 'Celebrate surrounded by lush gardens, blooming flowers, and natural elegance.',
    imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop&q=80',
    filterType: 'garden',
    venueCount: 12,
    gradient: 'from-green-400 to-green-600'
  },
  {
    id: '3',
    title: 'Luxury Ballrooms',
    subtitle: 'Elegance & sophistication',
    description: 'Grand celebrations in opulent settings with world-class service and amenities.',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop&q=80',
    filterType: 'ballroom',
    venueCount: 25,
    gradient: 'from-purple-400 to-purple-600'
  }
];

export default function HomepageManagement() {
  const [categories, setCategories] = useState<CategoryBox[]>(defaultCategories);
  const [editingCategory, setEditingCategory] = useState<CategoryBox | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/admin/login');
  };

  const handleEdit = (category: CategoryBox) => {
    setEditingCategory({ ...category });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingCategory) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? editingCategory : cat
      ));
      setIsModalOpen(false);
      setEditingCategory(null);
    }
  };

  const handleAddNew = () => {
    const newCategory: CategoryBox = {
      id: Date.now().toString(),
      title: 'New Category',
      subtitle: 'New subtitle',
      description: 'New description...',
      imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop&q=80',
      filterType: 'modern',
      venueCount: 0,
      gradient: 'from-gray-400 to-gray-600'
    };
    setEditingCategory(newCategory);
    setIsModalOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const suggestedImages = [
    { name: 'Beach Wedding', url: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop&q=80' },
    { name: 'Garden Wedding', url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop&q=80' },
    { name: 'Ballroom Wedding', url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop&q=80' },
    { name: 'Historic Venue', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop&q=80' },
    { name: 'Modern Venue', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop&q=80' },
    { name: 'Rustic Venue', url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop&q=80' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900">SoFlo Venues Admin</Link>
              <span className="mx-3 text-gray-400">/</span>
              <span className="text-lg text-gray-600">Homepage Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                View Site
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Homepage Category Management</h1>
          <p className="text-gray-600">Manage the category boxes shown on the homepage that link to filtered venue searches</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Category Boxes</h2>
              <p className="text-sm text-gray-600 mt-1">These boxes appear in the "Popular Venue Types" section on the homepage</p>
            </div>
            <button 
              onClick={handleAddNew}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium transition"
            >
              Add New Category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
              {/* Preview */}
              <div 
                className={`h-48 bg-gradient-to-br ${category.gradient} relative bg-cover bg-center`}
                style={{ backgroundImage: `url("${category.imageUrl}")` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{category.title}</h3>
                  <p className="text-blue-100">{category.subtitle}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-pink-600 font-medium">
                    Browse {category.venueCount}+ venues →
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Filter: {category.filterType}
                  </span>
                </div>
                
                {/* Admin Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Delete
                  </button>
                  <Link 
                    href={`/venues?type=${category.filterType}`}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition text-center"
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {isModalOpen && editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Category</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editingCategory.title}
                      onChange={(e) => setEditingCategory({...editingCategory, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                    <input
                      type="text"
                      value={editingCategory.subtitle}
                      onChange={(e) => setEditingCategory({...editingCategory, subtitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingCategory.description}
                      onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                    <select
                      value={editingCategory.filterType}
                      onChange={(e) => setEditingCategory({...editingCategory, filterType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="beach">Beach</option>
                      <option value="garden">Garden</option>
                      <option value="ballroom">Ballroom</option>
                      <option value="historic">Historic</option>
                      <option value="modern">Modern</option>
                      <option value="rustic">Rustic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue Count</label>
                    <input
                      type="number"
                      value={editingCategory.venueCount}
                      onChange={(e) => setEditingCategory({...editingCategory, venueCount: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
                    <input
                      type="url"
                      value={editingCategory.imageUrl}
                      onChange={(e) => setEditingCategory({...editingCategory, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                    
                    {/* Suggested Images */}
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Suggested wedding images:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {suggestedImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setEditingCategory({...editingCategory, imageUrl: image.url})}
                            className="relative group"
                          >
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="w-full h-16 object-cover rounded border-2 border-gray-200 hover:border-pink-500 transition"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition font-medium">
                                {image.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Colors</label>
                    <select
                      value={editingCategory.gradient}
                      onChange={(e) => setEditingCategory({...editingCategory, gradient: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="from-blue-400 to-blue-600">Blue Ocean</option>
                      <option value="from-green-400 to-green-600">Green Garden</option>
                      <option value="from-purple-400 to-purple-600">Purple Luxury</option>
                      <option value="from-amber-400 to-orange-600">Golden Sunset</option>
                      <option value="from-pink-400 to-rose-600">Rose Romance</option>
                      <option value="from-gray-400 to-gray-600">Classic Gray</option>
                    </select>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div 
                        className={`h-32 bg-gradient-to-br ${editingCategory.gradient} relative bg-cover bg-center`}
                        style={{ backgroundImage: `url("${editingCategory.imageUrl}")` }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        <div className="absolute bottom-2 left-2 text-white">
                          <h4 className="font-bold text-sm">{editingCategory.title}</h4>
                          <p className="text-xs opacity-90">{editingCategory.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-md font-medium transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
