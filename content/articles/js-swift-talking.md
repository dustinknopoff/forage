+++
title = "Retrieving data from a WKWebView and passing to SwiftUI"
date = 2020-12-05
[extra]
link = "https://github.com/dustinknopoff/degree-audit-macos/blob/main/Degree%20Audit%20macOS/View%20Elements/WebView.swift"
before = ["neuaudit.md"]
[taxonomies]
categories = ["dev"]
tags = ["swift"]
+++

> A vaguely related continuation of [NEU Audit Parsing](@/articles/neuaudit.md)

[Skip the backstory](#retrieving-html-from-a-wkwebview)

6 months ago, the Northeastern degree audit had bothered me to the point where I felt it was necessary to somehow get it in a machine readable format (JSON). I'd consider the results a kind of mixed bag. Yes, the output is JSON but I was so done with it that only recently have I considered actually building the UI layer I always envisioned. 

That's not strictly true.

I did create a dashboard like interface in Swift UI, but it was janky and wayyyy too many line charts. So, that was sunset into the `archive` directory.

Fast forward to about a month ago. My Human-Computer Interaction course has an assignment to point out bad designs and create a quick prototype of how it could be fixed.

![](https://res.cloudinary.com/dknopoff/image/upload/f_auto/v1607189153/portfolio/Audit.png)

And on a weekend where I should be doing other homework, I figure "Eh. I should try and make this into a macOS app with SwiftUI!"

![](https://res.cloudinary.com/dknopoff/image/upload/f_auto/v1607189495/portfolio/degree_audit_swiftui.png)

That is maybe 6 hours of work which really speaks to SwiftUI's capabilities!

**But, the hard part was yet to come.**

When that's pretty much done (and I still don't want to do the homework I _need_ to do), I decide I should try incorporating the audit parsing in as well. There's two aspects that make this difficult:

1. All of the SwiftUI examples and documentation uses UIKit.
2. To be able to interoperate Swift <-> JS, a `WKWebView` is necessary (rather than the much simpler `SFSafariView`)

All that together, most articles on the web wouldn't even compile :).

So, here's my hobbled code, that works.

A lot of this is adapted from [SwiftUI Labs](https://gist.github.com/swiftui-lab/a873bf413770db6fd1a525fa424ce8cd). I encourage you to use that if it makes more sense to you. Also, check out their [other work](https://swiftui-lab.com)! It's one of the most complete locations of SwiftUI resources.

## Retrieving HTML from a WKWebView

```swift
class WebViewStateModel: ObservableObject {
	@Published var pageTitle: String = "Web View"
	@Published var loading: Bool = false
	@Published var canGoBack: Bool = false
	@Published var goBack: Bool = false
	@Published var pageContent = ""
}

struct Webview_Preview: PreviewProvider {
	static var previews: some View {
		NavigationView {
			WebView(url: URL.init(string: "https://www.google.com")!, webViewStateModel: WebViewStateModel())
				.frame(width: 400)
		}
		
	}
}
```

The key is to pass an `@ObservableObject` to the `WebView` so that it can be passed through the Delegates, Coordinates, and WKWebView. This way in the actual function where it makes sense to execute the javascript, you can mutate the observed object and the access will be passed along to your view. In this particular case, it makes sense to run once a page [finishes loading](https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455629-webview).

```swift
webView.evaluateJavaScript("""
                  var docu = document.documentElement.innerHTML;
               docu
               """) { (result,error) in
			// Do some error checking
			if (error != nil || result == nil) {
				return
			}
			
			// If the Javascript function returns an object, cast it into a Dictionary
			let content = result as! String
			self.webViewStateModel.pageContent = content
		}
```

<details>
<summary>
Expand to see full diff
</summary>

```diff
 import SwiftUI
 import WebKit
-import Combine
 
-class WebViewData: ObservableObject {
+class WebViewStateModel: ObservableObject {
+    @Published var pageTitle: String = "Web View"
     @Published var loading: Bool = false
-    @Published var scrollPercent: Float = 0
-    @Published var url: URL? = nil
-    @Published var urlBar: String = "https://nasa.gov"
-
-    var scrollOnLoad: Float? = nil
+    @Published var canGoBack: Bool = false
+    @Published var goBack: Bool = false
+    @Published var pageContent = ""
 }
 
-#if os(macOS)
+struct WebView: View {
+    enum NavigationAction {
+        case decidePolicy(WKNavigationAction,  (WKNavigationActionPolicy) -> Void) //mendetory
+        case didRecieveAuthChallange(URLAuthenticationChallenge, (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) //mendetory
+        case didStartProvisionalNavigation(WKNavigation)
+        case didReceiveServerRedirectForProvisionalNavigation(WKNavigation)
+        case didCommit(WKNavigation)
+        case didFinish(WKNavigation)
+        case didFailProvisionalNavigation(WKNavigation,Error)
+        case didFail(WKNavigation,Error)
+    }
 
-struct WebView: NSViewRepresentable {
-    @ObservedObject var data: WebViewData
+    @ObservedObject var webViewStateModel: WebViewStateModel
 
-    func makeNSView(context: Context) -> WKWebView {
-        return context.coordinator.webView
-    }
+    private var actionDelegate: ((_ navigationAction: WebView.NavigationAction) -> Void)?
 
-    func updateNSView(_ nsView: WKWebView, context: Context) {
 
-        guard context.coordinator.loadedUrl != data.url else { return }
-        context.coordinator.loadedUrl = data.url
+    let uRLRequest: URLRequest
 
-        if let url = data.url {
-            DispatchQueue.main.async {
-                let request = URLRequest(url: url)
-                nsView.load(request)
-            }
-        }
 
-        context.coordinator.data.url = data.url
+    var body: some View {
+
+        WebViewWrapper(webViewStateModel: webViewStateModel,
+                       action: actionDelegate,
+                       request: uRLRequest)
+    }
+    /*
+    if passed onNavigationAction it is mendetory to complete URLAuthenticationChallenge and decidePolicyFor callbacks
+    */
+    init(uRLRequest: URLRequest, webViewStateModel: WebViewStateModel, onNavigationAction: ((_ navigationAction: WebView.NavigationAction) -> Void)?) {
+        self.uRLRequest = uRLRequest
+        self.webViewStateModel = webViewStateModel
+        self.actionDelegate = onNavigationAction
     }
 
-    func makeCoordinator() -> WebViewCoordinator {
-        return WebViewCoordinator(data: data)
+    init(url: URL, webViewStateModel: WebViewStateModel, onNavigationAction: ((_ navigationAction: WebView.NavigationAction) -> Void)? = nil) {
+        self.init(uRLRequest: URLRequest(url: url),
+                  webViewStateModel: webViewStateModel,
+                  onNavigationAction: onNavigationAction)
     }
 }
 
-#else
+/*
+A weird case: if you change WebViewWrapper to struct cahnge in WebViewStateModel will never call updateUIView
+*/
+
+final class WebViewWrapper : NSViewRepresentable {
+    @ObservedObject var webViewStateModel: WebViewStateModel
+    let action: ((_ navigationAction: WebView.NavigationAction) -> Void)?
 
-struct WebView: UIViewRepresentable {
-    @ObservedObject var data: WebViewData
+    let request: URLRequest
 
-    func makeUIView(context: Context) -> WKWebView {
-        return context.coordinator.webView
+    init(webViewStateModel: WebViewStateModel,
+         action: ((_ navigationAction: WebView.NavigationAction) -> Void)?,
+         request: URLRequest) {
+                                                                 self.action = action
+                                                                 self.request = request
+                                                                 self.webViewStateModel = webViewStateModel
     }
 
-    func updateUIView(_ uiView: WKWebView, context: Context) {
-        guard context.coordinator.loadedUrl != data.url else { return }
-        context.coordinator.loadedUrl = data.url
 
-        if let url = data.url {
-            DispatchQueue.main.async {
-                let request = URLRequest(url: url)
-                uiView.load(request)
-            }
-        }
-
-        context.coordinator.data.url = data.url
+    func makeNSView(context: Context) -> WKWebView  {
+        let view = WKWebView()
+        view.navigationDelegate = context.coordinator
+        view.load(request)
+        return view
     }
 
-    func makeCoordinator() -> WebViewCoordinator {
-        return WebViewCoordinator(data: data)
+    func updateNSView(_ uiView: WKWebView, context: Context) {
+        if uiView.canGoBack, webViewStateModel.goBack {
+            uiView.goBack()
+            webViewStateModel.goBack = true
+        }
     }
-}
 
-#endif
 
-class WebViewCoordinator: NSObject, WKNavigationDelegate {
-    @ObservedObject var data: WebViewData
 
-    var webView: WKWebView = WKWebView()
-    var loadedUrl: URL? = nil
+    func makeCoordinator() -> Coordinator {
+        return Coordinator(action: action, webViewStateModel: webViewStateModel)
+    }
 
-    init(data: WebViewData) {
-        self.data = data
+    final class Coordinator: NSObject {
+        @ObservedObject var webViewStateModel: WebViewStateModel
+        let action: ((_ navigationAction: WebView.NavigationAction) -> Void)?
 
-        super.init()
+        init(action: ((_ navigationAction: WebView.NavigationAction) -> Void)?,
+        webViewStateModel: WebViewStateModel) {
+                                                                                                  self.action = action
+                                                                                                  self.webViewStateModel = webViewStateModel
+
+        }
 
-        self.setupScripts()
-        webView.navigationDelegate = self
     }
+}
 
-    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
-        DispatchQueue.main.async {
-            if let scrollOnLoad = self.data.scrollOnLoad {
-                self.scrollTo(scrollOnLoad)
-                self.data.scrollOnLoad = nil
-            }
+extension WebViewWrapper.Coordinator: WKNavigationDelegate {
 
-            self.data.loading = false
+    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
 
-            if let urlstr = webView.url?.absoluteString {
-                self.data.urlBar = urlstr
-            }
+        if action == nil {
+            decisionHandler(.allow)
+        } else {
+            action?(.decidePolicy(navigationAction, decisionHandler))
         }
     }
 
     func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
-        DispatchQueue.main.async { self.data.loading = true }
+        webViewStateModel.loading = true
+        action?(.didStartProvisionalNavigation(navigation))
     }
 
-    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
-        showError(title: "Navigation Error", message: error.localizedDescription)
-        DispatchQueue.main.async { self.data.loading = false }
+    func webView(_ webView: WKWebView, didReceiveServerRedirectForProvisionalNavigation navigation: WKNavigation!) {
+        action?(.didReceiveServerRedirectForProvisionalNavigation(navigation))
+
     }
 
     func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
-        showError(title: "Loading Error", message: error.localizedDescription)
-        DispatchQueue.main.async { self.data.loading = false }
+        webViewStateModel.loading = false
+        webViewStateModel.canGoBack = webView.canGoBack
+        action?(.didFailProvisionalNavigation(navigation, error))
     }
 
-    func scrollTo(_ percent: Float) {
-        let js = "scrollToPercent(\(percent))"
-
-        webView.evaluateJavaScript(js)
+    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
+        action?(.didCommit(navigation))
     }
 
-    func setupScripts() {
-
-        let monitor = WKUserScript(source: ScrollMonitorScript.monitorScript,
-                                   injectionTime: .atDocumentEnd,
-                                   forMainFrameOnly: true)
-
-        let scrollTo = WKUserScript(source: ScrollMonitorScript.scrollTo,
-                                    injectionTime: .atDocumentEnd,
-                                    forMainFrameOnly: true)
-
-        webView.configuration.userContentController.addUserScript(monitor)
-        webView.configuration.userContentController.addUserScript(scrollTo)
-
-        let msgHandler = ScrollMonitorScript { percent in
-            DispatchQueue.main.async {
-                self.data.scrollPercent = percent
-            }
+    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
+        webViewStateModel.loading = false
+        webViewStateModel.canGoBack = webView.canGoBack
+        if let title = webView.title {
+            webViewStateModel.pageTitle = title
         }
-
-        webView.configuration.userContentController.add(msgHandler, contentWorld: .page, name: "notifyScroll")
+        webView.evaluateJavaScript("""
+                                   var docu = document.documentElement.innerHTML;
+                                   docu
+                                   """) { (result,error) in
+                                                                                                                                                 // Do some error checking
+                                       if (error != nil || result == nil) {
+                                           return
+                                       }
+
+                                       let content = result as! String
+                                       self.webViewStateModel.pageContent = content
+        }
+        action?(.didFinish(navigation))
     }
 
-    func showError(title: String, message: String) {
-        #if os(macOS)
-        let alert: NSAlert = NSAlert()
-
-        alert.messageText = title
-        alert.informativeText = message
-        alert.alertStyle = .warning
-
-        alert.runModal()
-        #else
-        print("\(title): \(message)")
-        #endif
+    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
+        webViewStateModel.loading = false
+        webViewStateModel.canGoBack = webView.canGoBack
+        action?(.didFail(navigation, error))
     }
-}
 
-class ScrollMonitorScript: NSObject, WKScriptMessageHandler {
-    let callback: (Float) -> ()
+    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
 
-    static var monitorScript: String {
-        return """
-        let last_known_scroll_position = 0;
-        let ticking = false;
-
-        function getScrollPercent() {
-        var docu = document.documentElement;
-
-        let t = docu.scrollTop;
-        let h = docu.scrollHeight;
-        let ch = docu.clientHeight
-
-        return (t / (h - ch)) * 100;
+        if action == nil  {
+            completionHandler(.performDefaultHandling, nil)
+        } else {
+            action?(.didRecieveAuthChallange(challenge, completionHandler))
         }
 
-        window.addEventListener('scroll', function(e) {
-        window.webkit.messageHandlers.notifyScroll.postMessage(getScrollPercent());
-        });
-        """
     }
 
-    static var scrollTo: String {
-        return """
-        function scrollToPercent(pct) {
-        var docu = document.documentElement;
-
-        let h = docu.scrollHeight;
-        let ch = docu.clientHeight
-
-        let t = (pct * (h - ch)) / 100;
+}
 
-        window.scrollTo(0, t);
+extension WebViewWrapper.Coordinator: WKUIDelegate {
+    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
+        if navigationAction.targetFrame == nil {
+            webView.load(navigationAction.request)
         }
-        """
-    }
 
-    init(callback: @escaping (Float) -> ()) {
-        self.callback = callback
-    }
-
-    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
-        if let percent = message.body as? NSNumber {
-            self.callback(percent.floatValue)
-        }
+        return nil
     }
 }
```
</details>

The completed file can be found [here](https://github.com/dustinknopoff/degree-audit-macos/blob/main/Degree%20Audit%20macOS/View%20Elements/WebView.swift) and it's used in a popover [when tapping some text](https://github.com/dustinknopoff/degree-audit-macos/blob/main/Degree%20Audit%20macOS/View%20Components/Top.swift).