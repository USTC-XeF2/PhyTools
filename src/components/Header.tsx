import { useEffect, useState } from "react";

interface HeaderProps {
  getTemplate: () => string;
}

function Header({ getTemplate }: HeaderProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  return (
    <>
      <div className="fixed t-0 flex items-center lg:justify-center w-full h-12 z-99 select-none text-white bg-gray-800">
        <h1 className="px-5 text-2xl font-bold">PhyTools</h1>
        <div className="absolute flex items-center right-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                .writeText(getTemplate())
                .then(() => setCopySuccess(true))
                .catch((err) => {
                  console.error("无法复制URL: ", err);
                  alert("无法复制URL模板");
                });
            }}
            className={`flex items-center justify-center cursor-pointer transition-colors duration-200 ${
              copySuccess ? "text-green-500" : "text-white hover:text-blue-300"
            }`}
            title="导出URL模板"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  copySuccess
                    ? "M5 13l4 4L19 7"
                    : "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                }
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default Header;
