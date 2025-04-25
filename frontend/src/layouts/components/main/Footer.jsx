const Footer = () => {
  return (
    <footer className="w-full bg-slate-900 h-[250px]">
      <div className="max-w-[1600px] mx-auto mt-[80px] px-main-padding flex flex-col gap-[49px]">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-20 items-center">
            <h1 className="text-white text-4xl font-bold">TNT</h1>
            <p className="text-white text-[20px]">|</p>
            <p className="text-white">Thời Trang Nam</p>
          </div>
          <div className="flex flex-row gap-10">
            <p className="text-white">Trang chủ</p>
            <p className="text-white">Về chúng tôi</p>
            <p className="text-white">Dịch vụ</p>
            <p className="text-white">Liên hệ</p>
          </div>
        </div>
        <div className="border-t border-gray-500">
          <p className="text-white text-[14px] text-center pt-4">
            © 2025 TNT. Nguyễn Minh Đức.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
