/*
This is the homepage component that displays the hero section and featured categories
*/

import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { SearchBar } from '../components/search/SearchBar'

export function HomePage() {
  const navigate = useNavigate()

  const featuredCategories = [
    {
      id: 'easy-distros',
      title: 'Easy Distros',
      description: 'Courses that fulfill distribution requirements with minimal effort',
      icon: '📚',
      color: 'blue',
      searchQuery: 'easy distribution'
    },
    {
      id: 'highest-rated',
      title: 'NU Top Rated Courses',
      description: 'These are the classes that students rave about',
      icon: '⭐',
      color: 'yellow',
      searchQuery: 'highly rated'
    },
    {
      id: 'stem-favorites',
      title: 'STEM Favorites',
      description: 'Popular science, technology, engineering, and math courses',
      icon: '🔬',
      color: 'green',
      searchQuery: 'STEM'
    },
    {
      id: 'small-classes',
      title: 'Small Classes',
      description: 'Intimate learning environments with personalized attention',
      icon: '👥',
      color: 'purple',
      searchQuery: 'small class size'
    },
    {
      id: 'fun-elective',
      title: 'Fun Electives',
      description: 'Interesting courses outside your major for exploration',
      icon: '🎨',
      color: 'pink',
      searchQuery: 'fun elective'
    },
    {
      id: 'writing-intensive',
      title: 'Writing Intensive',
      description: 'Courses that fulfill writing requirements',
      icon: '✍️',
      color: 'orange',
      searchQuery: 'writing intensive'
    }
  ]

  const handleCategoryClick = (category) => {
    navigate(`/search?q=${encodeURIComponent(category.searchQuery)}`)
  }

  return (
    <Layout>
      <div className="homepage">
        <div className="hero">
          <h1 className="hero-title">CTEC Search</h1>
          <p className="hero-subtitle">Find your perfect course at Northwestern</p>
          
          <div className="search-section">
            <SearchBar 
              onSearch={(query) => {
                navigate(`/search?q=${encodeURIComponent(query)}`)
              }}
              placeholder="Search courses or instructors..."
            />
          </div>
        </div>

        <div className="featured-categories">
          <div className="categories-header">
            <h2>Explore by Category</h2>
            <p>Discover courses that match your interests and needs</p>
          </div>
          
          <div className="categories-carousel">
            {featuredCategories.map((category) => (
              <div 
                key={category.id}
                className={`category-card ${category.color}`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3 className="category-title">{category.title}</h3>
                <p className="category-description">{category.description}</p>
                <div className="category-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}