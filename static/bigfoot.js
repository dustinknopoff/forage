function bigfoot(options) {
  let addBreakpoint,
    baseFontSize,
    bigfoot,
    buttonHover,
    calculatePixelDimension,
    cleanFootnoteLinks,
    clickButton,
    createPopover,
    defaults,
    deleteEmptyOrHR,
    escapeKeypress,
    footnoteInit,
    getSetting,
    makeDefaultCallbacks,
    popoverStates,
    positionTooltip,
    removeBackLinks,
    removeBreakpoint,
    removePopovers,
    replaceWithReferenceAttributes,
    repositionFeet,
    roomCalc,
    settings,
    touchClick,
    unhoverFeet,
    updateSetting,
    viewportDetails;
  bigfoot = void 0;
  defaults = {
    actionOriginalFN: "hide",
    activateCallback: function () {},
    activateOnHover: false,
    allowMultipleFN: false,
    anchorPattern: /(fn|footnote|note)[:\-_\d]/gi,
    anchorParentTagname: "sup",
    breakpoints: {},
    deleteOnUnhover: false,
    footnoteParentClass: "footnote",
    footnoteTagname: "li",
    hoverDelay: 250,
    numberResetSelector: void 0,
    popoverDeleteDelay: 300,
    popoverCreateDelay: 100,
    positionContent: true,
    preventPageScroll: true,
    scope: false,
    useFootnoteOnlyOnce: true,
    contentMarkup:
      '<aside class="bigfoot-footnote is-positioned-bottom" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="Footnote {{FOOTNOTENUM}}"> <div class="bigfoot-footnote__wrapper"> <div class="bigfoot-footnote__content"> {{FOOTNOTECONTENT}} </div></div> <div class="bigfoot-footnote__tooltip"></div> </aside>',
    buttonMarkup:
      '<div class=\'bigfoot-footnote__container\'> <button class="bigfoot-footnote__button" id="{{SUP:data-footnote-backlink-ref}}" data-footnote-number="{{FOOTNOTENUM}}" data-footnote-identifier="{{FOOTNOTEID}}" alt="See Footnote {{FOOTNOTENUM}}" rel="footnote" data-bigfoot-footnote="{{FOOTNOTECONTENT}}"> <svg class="bigfoot-footnote__button__circle" viewbox="0 0 6 6" preserveAspectRatio="xMinYMin"><circle r="3" cx="3" cy="3" fill="white"></circle></svg> <svg class="bigfoot-footnote__button__circle" viewbox="0 0 6 6" preserveAspectRatio="xMinYMin"><circle r="3" cx="3" cy="3" fill="white"></circle></svg> <svg class="bigfoot-footnote__button__circle" viewbox="0 0 6 6" preserveAspectRatio="xMinYMin"><circle r="3" cx="3" cy="3" fill="white"></circle></svg> </button></div>',
  };
  settings = Object.assign(defaults, options);
  popoverStates = {};
  function footnotInit() {
    var $curResetElement,
      $currentLastFootnoteLink,
      $footnoteAnchors,
      $footnoteButton,
      $lastResetElement,
      $parent,
      $relevantFNLink,
      $relevantFootnote,
      finalFNLinks,
      footnoteButton,
      footnoteButtonSearchQuery,
      footnoteContent,
      footnoteIDNum,
      footnoteLinks,
      footnoteNum,
      footnotes,
      i,
      _i,
      _ref,
      _results;
    footnoteButtonSearchQuery = settings.scope
      ? "" + settings.scope + ' a[href*="#"]'
      : 'a[href*="#"]';
    $footnoteAnchors = document
      .querySelectorAll(footnoteButtonSearchQuery)
      .filter((val) => {
        relAttr = val.getAttribute("rel");
        if (relAttr === "null" || relAttr == null) {
          relAttr = "";
        }
        return (
          ("" + val.getAttribute("href") + relAttr).match(
            settings.anchorPattern
          ) &&
          val.closest(
            "[class*=" +
              settings.footnoteParentClass +
              "]:not(a):not(" +
              settings.anchorParentTagname +
              ")"
          ).length < 1
        );
      });
    footnotes = [];
    footnoteLinks = [];
    finalFNLinks = [];
    cleanFootnoteLinks($footnoteAnchors, footnoteLinks);
    footnoteLinks.forEach((val) => {
      var $closestFootnoteEl, relatedFN;
      relatedFN = val.dataset["footnote-ref"].replace(/[:.+~*\]\[]/g, "\\$&");
      if (settings.useFootnoteOnlyOnce) {
        relatedFN = "" + relatedFN + ":not(.footnote-processed)";
      }
      $closestFootnoteEl = document
        .querySelectorAll(relatedFN)
        .closest(settings.footnoteTagname);
      if ($closestFootnoteEl.length > 0) {
        footnotes.push(
          $closestFootnoteEl.first().addClass("footnote-processed")
        );
        return finalFNLinks.push(this);
      }
    });
    $currentLastFootnoteLink = document.querySelectorAll(
      "[data-footnote-identifier]:last"
    );
    footnoteIDNum =
      $currentLastFootnoteLink.length < 1
        ? 0
        : +$currentLastFootnoteLink.dataset["footnote-identifier"];
    _results = [];
    for (
      i = _i = 0, _ref = footnotes.length;
      0 <= _ref ? _i < _ref : _i > _ref;
      i = 0 <= _ref ? ++_i : --_i
    ) {
      footnoteContent = removeBackLinks(
        document.querySelectorAll(footnotes[i]).html().trim(),
        document.querySelectorAll(finalFNLinks[i]).data("footnote-backlink-ref")
      );
      footnoteContent = footnoteContent
        .replace(/"/g, "&quot;")
        .replace(/&lt;/g, "&ltsym;")
        .replace(/&gt;/g, "&gtsym;");
      footnoteIDNum += 1;
      footnoteButton = "";
      $relevantFNLink = document.querySelectorAll(finalFNLinks[i]);
      $relevantFootnote = document.querySelectorAll(footnotes[i]);
      if (settings.numberResetSelector != null) {
        $curResetElement = $relevantFNLink.closest(
          settings.numberResetSelector
        );
        if ($curResetElement === $lastResetElement) {
          footnoteNum += 1;
        } else {
          footnoteNum = 1;
        }
        $lastResetElement = $curResetElement;
      } else {
        footnoteNum = footnoteIDNum;
      }
      if (footnoteContent.indexOf("<") !== 0) {
        footnoteContent = "<p>" + footnoteContent + "</p>";
      }
      footnoteButton = settings.buttonMarkup
        .replace(/\{\{FOOTNOTENUM\}\}/g, footnoteNum)
        .replace(/\{\{FOOTNOTEID\}\}/g, footnoteIDNum)
        .replace(/\{\{FOOTNOTECONTENT\}\}/g, footnoteContent);
      footnoteButton = replaceWithReferenceAttributes(
        footnoteButton,
        "SUP",
        $relevantFNLink
      );
      footnoteButton = replaceWithReferenceAttributes(
        footnoteButton,
        "FN",
        $relevantFootnote
      );
      $footnoteButton = document
        .querySelectorAll(footnoteButton)
        .insertBefore($relevantFNLink);
      $parent = $relevantFootnote.parent();
      switch (settings.actionOriginalFN.toLowerCase()) {
        case "hide":
          $relevantFNLink.addClass("footnote-print-only");
          $relevantFootnote.addClass("footnote-print-only");
          _results.push(deleteEmptyOrHR($parent));
          break;
        case "delete":
          $relevantFNLink.remove();
          $relevantFootnote.remove();
          _results.push(deleteEmptyOrHR($parent));
          break;
        default:
          _results.push($relevantFNLink.addClass("footnote-print-only"));
      }
    }
    return _results;
  }
}
