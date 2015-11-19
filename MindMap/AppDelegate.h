//
//  AppDelegate.h
//  MindMap
//
//  Created by Rusmin Susanto on 11/11/2015.
//  Copyright (c) 2015 Rusmin Susanto. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (nonatomic, assign) IBOutlet WebView* webView;

@end

