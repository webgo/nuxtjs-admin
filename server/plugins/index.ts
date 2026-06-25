export default defineNitroPlugin((nitroApp) => {
  // 这里可以写一些服务启动时的逻辑
  console.log("=== Nitro服务已启动 ===");
  // scheduleTask(); // 启动定时任务

  // 服务停止时的Hook
  nitroApp.hooks.hook("close", async () => {
    console.log("=== Nitro服务已停止 ===");
  });
});

// 定义一个定时任务，每分钟执行一次
function scheduleTask() {
  let count = 0;
  setInterval(() => {
    count++;
    console.log(`=== 定时任务执行中 (${count}) ===`);
  }, 60000);
}
