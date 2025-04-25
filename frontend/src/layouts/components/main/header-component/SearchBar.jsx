import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter" && keyword.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
      setIsSearchOpen(false);
      setKeyword("");
    }
  };

  return (
    <div className="relative flex items-center">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        className="text-[24px] hover:text-gray-600 cursor-pointer"
        onClick={() => setIsSearchOpen(!isSearchOpen)}
      />

      <div
        ref={searchRef}
        className={`absolute right-full top-1/2 transform -translate-y-1/2 w-64 bg-white shadow-md rounded transition-all duration-300 z-10 ${
          isSearchOpen
            ? "-translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <input
          type="text"
          placeholder="Tìm theo tên hoặc SKU..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>
    </div>
  );
};

export default SearchBar;
