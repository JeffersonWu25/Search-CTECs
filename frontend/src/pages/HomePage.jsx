import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { SearchBar } from '../components/search/SearchBar'

export function HomePage() {
  const navigate = useNavigate()

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
      </div>
    </Layout>
  )
}