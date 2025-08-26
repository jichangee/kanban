export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-xl font-semibold">请检查你的邮箱</h1>
        <p className="mb-4 text-gray-600">我们已向你的邮箱发送了一封登录验证邮件，请点击其中的链接完成登录。</p>
        <div className="text-sm text-gray-500">
          <p className="mb-1">提示：</p>
          <ul className="list-inside list-disc space-y-1">
            <li>如果没有看到邮件，请检查垃圾邮件或广告邮件。</li>
            <li>开发环境下不会真正发送邮件，登录链接会打印在运行终端中。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
