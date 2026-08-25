package com.businesssarthi.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        // Force the app theme BEFORE super.onCreate to ensure NoActionBar is applied early
        setTheme(R.style.AppTheme);
        super.onCreate(savedInstanceState);
    }
}


