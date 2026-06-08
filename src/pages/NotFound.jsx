import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="not-found">
            <h1><span>4</span><span>0</span><span>4</span></h1>
            <h2><span>Page</span> <span>Not</span> <span>Found</span></h2>
            <p>The page you're looking for doesn't exist.</p>

            <Link to="/">
                Go Back Home
            </Link>
        </div>
    );
}

export default NotFound;