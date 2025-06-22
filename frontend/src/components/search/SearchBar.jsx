import { useSearch } from '../../hooks/useSearch'
import './SearchBar.css'

export function SearchBar({ onSearch, placeholder = "Search courses or instructors..." }) {
  const {
    query,
    results,
    loading,
    showDropdown,
    handleInputChange,
    handleResultSelect,
    handleInputFocus,
    handleInputBlur
  } = useSearch()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && onSearch) {
      onSearch(query.trim())
    }
  }

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="search-input"
          />
          {loading && <div className="search-spinner"></div>}
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
        
        {showDropdown && (
          <div className="search-dropdown">
            {results.length > 0 ? (
              <ul className="search-results">
                {results.map((result, index) => (
                  <li
                    key={`${result.type}-${result.id || index}`}
                    className="search-result-item"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="result-content">
                      <div className="result-title">
                        {result.type === 'course' ? result.title : result.name}
                      </div>
                      <div className="result-subtitle">
                        {result.type === 'course' ? result.code : 'Instructor'}
                      </div>
                    </div>
                    <div className="result-type">
                      {result.type === 'course' ? '📚' : '👨‍🏫'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-results">
                No results found
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
