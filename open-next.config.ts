{
	  default: {
	    override: {
	      wrapper: "cloudflare-node",
	      converter: "edge",
	      proxyExternalRequest: "fetch",
	      incrementalCache: "dummy" | function,
	      tagCache: "dummy" | function,
	      queue: "dummy" | "direct" | function,
	    },
	  },
	  edgeExternals: ["node:crypto"],
	  middleware: {
	    external: true,
	    override: {
	      wrapper: "cloudflare-edge",
	      converter: "edge",
	      proxyExternalRequest: "fetch",
	      incrementalCache: "dummy" | function,
	      tagCache: "dummy" | function,
	      queue: "dummy" | "direct" | function,
	    },
	  },
}
