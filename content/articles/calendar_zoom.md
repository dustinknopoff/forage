+++
title = "Extract Zoom links from Calendar"
date = 2020-12-10
draft = true
[extra]
link = "https://github.com/dustinknopoff/calendar"
[taxonomies]
categories = ["dev"]
tags = ["swift"]
+++

For some reason, Zoom refuses to connect my Northeastern schedule in to the app. Having to open the Calendar app, wait for it to load, click on the next event, and then double click the zoom link in the description is _way to much work_.

[iCalBuddy](http://hasseg.org/icalBuddy/) is **the** CLI utility to access macOS calendars but I found the control over how content is output limiting and not working with what I intended.

So I decided I might as well implement it myself. Swift and the whole Apple developer ecosystem is something I've wanted to dive into but learning iOS/macOS frameworks always made it overwhelming. This only touching the calendar access framework made it a perfect opportunity to avoid that overwhelming feeling.

It turns out, it's not even 100 lines!

## Accessing the Event Store

```swift
import Foundation
import EventKit

let store = EKEventStore()
store.requestAccess(to: .event) { (granted, error) in
	if let error = error {
		print("error: \(error.localizedDescription)")
	} else {
        print("access granted")
    }
}

let calendars = store.calendars(for: .event)
```

For some reason, this doesn't run in XCode. But, if you run `swiftc main.swift -o calendar` from a terminal, you'll see `access granted`

## Getting Today's events

```swift
// Get the appropriate calendar.
var calendar = Calendar.current

// Create the start date components
let startOfDay = calendar.startOfDay(for: Date())

var endOfDay: Date {
	var components = DateComponents()
	components.day = 1
	components.second = -1
	return Calendar.current.date(byAdding: components, to: startOfDay)!
}

let predicate = store.predicateForEvents(withStart: startOfDay, end: endOfDay, calendars: calendars)
var events = store.events(matching: predicate)
```

The code above is just creating a start date of now and end date to be the end of today. Then a special calendar predicate is created from this, filtered, and returned in the `events` variable.

## Outputing for AWK

```swift
func matches(for regex: String, in text: String) -> [String] {
	
	do {
		let regex = try NSRegularExpression(pattern: regex)
		let results = regex.matches(in: text,
									range: NSRange(text.startIndex..., in: text))
		return results.map {
			String(text[Range($0.range, in: text)!])
		}
	} catch let error {
		print("invalid regex: \(error.localizedDescription)")
		return []
	}
}

for event in events {
	let title = event.title!
	guard let notes = event.notes else {
		continue
	}
	let zoomMatches = matches(for: "https://northeastern.zoom.us/j/\\d+(\\?pwd=\\w+)?", in: notes)
	if zoomMatches.isEmpty {
		continue
	}
	let link = zoomMatches[0]
	print("\(title),\(link)")
}
```

The `matches()` helper function makes it easy to just receive all matches of a regex expression within a string. Then, for every event we print the event title and zoom link.

This is done with intention of being easily passible to `awk`

```bash
function zmn() {
  val=`calendar-links| fzf | awk -F ',' '{print $2}'`
  if [ -n $val ]; then
    open $val
  else
    echo "No zoom links to open."
  fi
}
```

This way I can see the name of the events, select the one I want to join and it will automatically open the zoom link.