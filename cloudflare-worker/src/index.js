export default {
  async fetch(request, env) {
    return new Response("OK");
  },

  async email(message, env, ctx) {
    console.log("GOT EMAIL from:", message.from);
  },
};
