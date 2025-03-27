import logging


# ログ出力設定
def get_my_logger(name):
    # DEBUGレベルで設定
    logging.basicConfig(
        level=logging.DEBUG,
        # ■[ログレベル] パス名, モジュール名, 関数名, メッセージ（処理結果,ライブラリからのレスポンス）
        format='[%(levelname)s] %(pathname)s, %(module)s, %(funcName)s, %(message)s'
    )
    logger = logging.getLogger(name)

    return logger
