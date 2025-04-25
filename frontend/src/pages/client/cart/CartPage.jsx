import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import cartService from "../../../services/cartService";
import orderService from "../../../services/orderService";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const shippingCost = 0;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await cartService.getCart();
        setCart(
          response?.cartItems
            ? response.cartItems.sort((a, b) => a.id - b.id)
            : []
        );
      } catch (error) {
        console.error("❌ Fetch Cart Error:", error);
      }
      setLoading(false);
    };
    fetchCart();
  }, []);

  const cartRef = useRef([]);
  useEffect(() => {
    if (JSON.stringify(cartRef.current) !== JSON.stringify(cart)) {
      localStorage.setItem("cart", JSON.stringify(cart));
      cartRef.current = cart;
    }
  }, [cart]);

  console.log(cart);

  const handleQuantityChange = async (id, delta) => {
    try {
      let itemToUpdate = cart.find((item) => item.id === id);
      if (!itemToUpdate) return;

      let newQuantity = Math.max(itemToUpdate.quantity + delta, 1);

      // console.log(
      //   ` Cập nhật sản phẩm ID ${id} từ ${itemToUpdate.quantity} ➝ ${newQuantity}`
      // );
      const productSize = itemToUpdate.productSize;
      const maxQuantity = productSize?.quantity || 0;

      if (newQuantity > maxQuantity) {
        toast.error(`Số lượng tối đa cho sản phẩm này là ${maxQuantity}.`);
        return;
      }

      await cartService.updateQuantity(id, newQuantity);

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      // console.log("✅ Giỏ hàng sau cập nhật:", cart);
    } catch (error) {
      console.error("❌ Lỗi cập nhật số lượng:", error);
    }
  };

  const handleRemove = async (id) => {
    setCart(cart.filter((item) => item.id !== id));
    try {
      await cartService.removeFromCart(id);
    } catch (error) {
      console.error("❌ Lỗi xóa sản phẩm:", error);
    }
  };

  const handleSelectAll = () => {
    const newSelectAll = !cart.every((item) => item.selected);
    setCart(cart.map((item) => ({ ...item, selected: newSelectAll })));
  };

  const selectedItems = cart.filter((item) => item.selected);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1),
    0
  );
  const total = subtotal + shippingCost;

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;

    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    navigate("/checkout", {
      state: { items: selectedItems, user: currentUser },
    });
  };

  return (
    <div className="w-full flex items-start gap-6 p-6 relative">
      <ToastContainer />
      <div className="w-2/3 bg-white p-4 rounded-lg border border-gray-300 shadow-md">
        <h1 className="text-[30px] font-semibold text-center mb-4">Giỏ hàng</h1>

        {loading ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : cart.length === 0 ? (
          <p className="text-center text-gray-500">Giỏ hàng trống</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={cart.every((item) => item.selected)}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-3 text-center">Sản phẩm</th>
                <th className="p-3 text-center">Số lượng</th>
                <th className="p-3 text-center">Giá</th>
                <th className="p-3 text-center">Thành tiền</th>
                <th className="p-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  onSelect={() =>
                    setCart((prev) =>
                      prev.map((p) =>
                        p.id === item.id ? { ...p, selected: !p.selected } : p
                      )
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <CartSummary
        subtotal={subtotal}
        shippingCost={shippingCost}
        total={total}
        onOrder={handleCheckout}
        disabled={selectedItems.length === 0}
      />
    </div>
  );
};

export default CartPage;
