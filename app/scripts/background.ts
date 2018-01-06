import 'chromereload/devonly';
import {BGMSGType} from './const';
import MessageSender = chrome.runtime.MessageSender;

chrome.runtime.onMessage.addListener(function (message: BGMSGType, sender: MessageSender, sendResponse: (response: any) => void) {
  switch (message) {
    case BGMSGType.ENABLE_PAGE_ACTION:
      if (sender.tab && sender.tab.id) {
        chrome.pageAction.show(sender.tab.id);
      }
      break;
  }
});
