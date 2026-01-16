self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response('游戏离线可用，请连接网络获取最新版本');
    })
  );
});