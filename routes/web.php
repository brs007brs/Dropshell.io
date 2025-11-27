<?php

use Illuminate\Support\Facades\Route;

Route::get('/', [App\Http\Controllers\FileController::class, 'index']);
