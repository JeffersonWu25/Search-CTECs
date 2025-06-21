import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <h1>CTEC Search</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/search" className="nav-link">Search</Link>
          <Link to="/about" className="nav-link">About</Link>
        </nav>
      </div>
    </header>
  )
}