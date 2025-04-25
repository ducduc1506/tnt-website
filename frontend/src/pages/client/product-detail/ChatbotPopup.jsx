import { useState, useEffect } from "react";
import { IoChatbubblesOutline, IoClose, IoSend } from "react-icons/io5";
import {
  getChatResponse,
  getWelcomeMessage,
} from "../../../services/chatService";

const ChatbotPopup = ({ product }) => {
  const [isOpen, setIsOpen] = useState(true); // Mở chatbot ngay từ đầu
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      if (messages.length === 0) {
        try {
          const welcomeMsg = product
            ? await getWelcomeMessage(product)
            : "Xin chào! Mình có thể giúp gì cho bạn?";
          setMessages([{ text: welcomeMsg, sender: "bot" }]);
        } catch {
          setMessages([
            {
              text: "Xin lỗi, có lỗi xảy ra khi lấy dữ liệu sản phẩm.",
              sender: "bot",
            },
          ]);
        }
      }
    };

    fetchWelcomeMessage();
  }, [product]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { text: message, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      const botReply = await getChatResponse(message, product);
      setMessages((prev) => [...prev, { text: botReply, sender: "bot" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Xin lỗi, có lỗi xảy ra.", sender: "bot" },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleChat}
        className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-600 transition"
      >
        <IoChatbubblesOutline size={24} />
      </button>

      {isOpen && (
        <div className="bg-white shadow-lg w-80 rounded-lg fixed bottom-16 right-6 border border-gray-300">
          {/* Tiêu đề */}
          <div className="p-3 flex justify-between items-center bg-black text-white rounded-t-lg">
            <h2 className="text-lg">Chatbot tư vấn</h2>
            <button onClick={toggleChat}>
              <IoClose size={24} />
            </button>
          </div>

          {/* Nội dung chat */}
          <div className="p-3 h-80 overflow-y-auto space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-1 p-2 rounded-md ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-right"
                    : "bg-gray-200 text-left"
                }`}
                dangerouslySetInnerHTML={{ __html: msg.text }} // Chuyển text thành HTML
              ></div>
            ))}
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-3 border-t flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 p-2 border rounded-l-md outline-none"
              placeholder="Nhập tin nhắn..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-black text-white px-4 rounded-r-md disabled:opacity-50"
              disabled={!message.trim()}
            >
              <IoSend size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotPopup;
