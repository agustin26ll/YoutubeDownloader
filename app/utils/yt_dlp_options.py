JS_RUNTIMES = { "deno" : {}}
REMOTE_COMPONENTS = {"ejs:github"}

def base_ydl_options() -> dict:
    return {
        "js_runtimes": JS_RUNTIMES,
        "remote_components": REMOTE_COMPONENTS
    }