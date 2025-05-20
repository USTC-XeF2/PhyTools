import { useEffect, useState } from "react";

import { useGlobalContext } from "../utils/context";

import type { Settings } from "../types";

interface SettingMenuProps {
  close: () => void;
  setSettings: (settings: Settings) => void;
}

interface HeaderProps {
  getTemplate: () => string;
  setSettings: (settings: Settings) => void;
}

function SettingMenu({ close, setSettings }: SettingMenuProps) {
  const { settings } = useGlobalContext();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleSetGravity = () => {
    const g_0 = 9.7803185;
    const a = 0.005278895;
    const b = 0.000023462;

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const sAngle = Math.sin((p.coords.latitude * Math.PI) / 180);
        const g = g_0 * (1 + a * sAngle ** 2 + b * sAngle ** 4);
        setSettings({
          ...settings,
          gravity: Number(g.toFixed(5)),
        });
        setIsLoadingLocation(false);
      },
      (e) => {
        setIsLoadingLocation(false);
        alert("获取位置信息失败: " + e.message);
      },
    );
  };

  return (
    <div className="absolute top-10 right-0 w-80 z-100 border border-gray-200 rounded-lg shadow-lg text-black bg-white">
      <div className="relative flex justify-between items-center px-3 py-2 bg-gray-100 rounded-t-lg">
        <div className="text-gray-500">设置</div>
        <button
          onClick={close}
          className="cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 p-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          g (m/s²)
        </label>
        <input
          type="text"
          value={settings.gravity}
          onChange={(e) => {
            const g = parseFloat(e.target.value);
            if (g > 0)
              setSettings({
                ...settings,
                gravity: g,
              });
          }}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
        />
        <button
          onClick={handleSetGravity}
          disabled={!navigator.geolocation || isLoadingLocation}
          className={`p-1.5 rounded transition-colors ${
            navigator.geolocation && !isLoadingLocation
              ? "cursor-pointer text-blue-600 bg-blue-100 hover:bg-blue-200"
              : "cursor-not-allowed text-gray-500 bg-gray-200"
          }`}
          title={
            !navigator.geolocation
              ? "地理位置服务不可用"
              : isLoadingLocation
                ? "正在获取位置..."
                : "获取本地重力加速度"
          }
        >
          {isLoadingLocation ? (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function Header({ getTemplate, setSettings }: HeaderProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
        <div className="absolute flex items-center right-2 gap-4">
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
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-center cursor-pointer transition-colors duration-200 text-white hover:text-blue-300"
            title="设置"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          {showSettings && (
            <SettingMenu
              close={() => setShowSettings(false)}
              setSettings={setSettings}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Header;
