import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BtnAddNew from "../../../components/button/BtnAddNew";
import ProductCard from "./ProductCard";
import productService from "../../../services/productService";

const ProInCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProductsByCategory(categoryId);
        setProducts(data);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return (
    <div className="w-2/3 bg-white py-4 px-3 rounded flex flex-col gap-2">
      <h1 className="text-lg font-semibold">Sản phẩm trong danh mục</h1>
      {products.length === 0 ? (
        <p className="text-gray-500 italic">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              image={`${import.meta.env.VITE_API_URL}${product.main_image}`}
            />
          ))}
        </div>
      )}
      <BtnAddNew
        name="Thêm sản phẩm"
        onClick={() => navigate("/admin/products/create")}
      />
    </div>
  );
};

export default ProInCategory;
